/**
 * subscriptionService — manages ProFish subscription tiers and purchase state
 *
 * Phase 1 Tiers:
 *   FREE  — Map, catch log (10/mo), weather, solunar, 5 AI IDs/day, basic community
 *   PRO   ($59.99/yr) — Unlimited everything + bathymetry + SST + chlorophyll + offline + stats
 *
 * Phase 2 Tiers:
 *   TEAM  ($149.99/yr) — Pro + team GPS, tournaments, leaderboards
 *   GUIDE ($249.99/yr) — Team + booking system, client management, charter tools
 *
 * Product SKUs (Google Play / Apple):
 *   profish_pro_yearly    — Pro tier annual
 *   profish_pro_monthly   — Pro tier monthly
 *   profish_team_yearly   — Team tier annual (Phase 2)
 *   profish_team_monthly  — Team tier monthly (Phase 2)
 *   profish_guide_yearly  — Guide tier annual (Phase 2)
 *   profish_guide_monthly — Guide tier monthly (Phase 2)
 *
 * Note: Prices are PPP-adjusted per region via RevenueCat
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@profish_subscription';

// ── Tiers & SKUs ────────────────────────────────────────
export const TIERS = {
  FREE: 'free',
  PRO: 'pro',
  TEAM: 'team',
  GUIDE: 'guide',
};

export const TIER_META = {
  [TIERS.FREE]: {
    label: 'Free',
    price: '$0',
    color: '#888',
    icon: '🎣',
    description: 'Maps, catch log (10/mo), weather, solunar, 5 AI IDs/day',
  },
  [TIERS.PRO]: {
    label: 'Pro',
    price: '$59.99/yr',
    priceMonthly: '$4.99/mo',
    color: '#FF9800',
    icon: '⭐',
    description:
      'Unlimited catches, all layers, offline maps, stats, AI species ID',
  },
  [TIERS.TEAM]: {
    label: 'Team',
    price: '$149.99/yr',
    priceMonthly: '$14.99/mo',
    color: '#4CAF50',
    icon: '👥',
    description: 'Pro + team GPS, tournaments, leaderboards',
    phase: 2,
  },
  [TIERS.GUIDE]: {
    label: 'Guide',
    price: '$249.99/yr',
    priceMonthly: '$24.99/mo',
    color: '#2196F3',
    icon: '🚤',
    description: 'Team + booking system, client management, charter tools',
    phase: 2,
  },
};

export const PRODUCT_SKUS = {
  PRO_YEARLY: 'profish_pro_yearly',
  PRO_MONTHLY: 'profish_pro_monthly',
  TEAM_YEARLY: 'profish_team_yearly',
  TEAM_MONTHLY: 'profish_team_monthly',
  GUIDE_YEARLY: 'profish_guide_yearly',
  GUIDE_MONTHLY: 'profish_guide_monthly',
};

// ── Feature limits by tier ──────────────────────────────
export const TIER_LIMITS = {
  [TIERS.FREE]: {
    maxCatchesPerMonth: 10,
    maxFishingSpots: 5,
    fishCastDays: 3,
    aiSpeciesIdPerDay: 5,
    offlineMaps: false,
    catchPhotos: false,
    bathymetry: false,
    sst: false,
    chlorophyll: false,
    fishHotspots: false,
    nauticalCharts: false,
    depthContours: false,
    catchStats: false,
    teamGps: false,
    tournaments: false,
    guideBookings: false,
  },
  [TIERS.PRO]: {
    maxCatchesPerMonth: Infinity,
    maxFishingSpots: Infinity,
    fishCastDays: 16,
    aiSpeciesIdPerDay: Infinity,
    offlineMaps: true,
    catchPhotos: true,
    bathymetry: true,
    sst: true,
    chlorophyll: true,
    fishHotspots: true,
    nauticalCharts: true,
    depthContours: true,
    catchStats: true,
    teamGps: false,
    tournaments: false,
    guideBookings: false,
  },
  [TIERS.TEAM]: {
    maxCatchesPerMonth: Infinity,
    maxFishingSpots: Infinity,
    fishCastDays: 16,
    aiSpeciesIdPerDay: Infinity,
    offlineMaps: true,
    catchPhotos: true,
    bathymetry: true,
    sst: true,
    chlorophyll: true,
    fishHotspots: true,
    nauticalCharts: true,
    depthContours: true,
    catchStats: true,
    teamGps: true,
    tournaments: true,
    guideBookings: false,
  },
  [TIERS.GUIDE]: {
    maxCatchesPerMonth: Infinity,
    maxFishingSpots: Infinity,
    fishCastDays: 16,
    aiSpeciesIdPerDay: Infinity,
    offlineMaps: true,
    catchPhotos: true,
    bathymetry: true,
    sst: true,
    chlorophyll: true,
    fishHotspots: true,
    nauticalCharts: true,
    depthContours: true,
    catchStats: true,
    teamGps: true,
    tournaments: true,
    guideBookings: true,
  },
};

// ── Service state ───────────────────────────────────────
let _currentTier = TIERS.FREE;
let _expiresAt = null;
let _listeners = [];

const subscriptionService = {
  async init() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        _currentTier = data.tier || TIERS.FREE;
        _expiresAt = data.expiresAt || null;

        // Check expiry
        if (_expiresAt && new Date(_expiresAt) < new Date()) {
          _currentTier = TIERS.FREE;
          _expiresAt = null;
          await this._persist();
        }
      }
    } catch (e) {
      console.warn('[Subscription] Failed to load:', e);
      _currentTier = TIERS.FREE;
    }
  },

  getCurrentTier() {
    return _currentTier;
  },

  getExpiresAt() {
    return _expiresAt;
  },

  isPro() {
    return (
      _currentTier === TIERS.PRO ||
      _currentTier === TIERS.TEAM ||
      _currentTier === TIERS.GUIDE
    );
  },

  isTeam() {
    return _currentTier === TIERS.TEAM || _currentTier === TIERS.GUIDE;
  },

  isGuide() {
    return _currentTier === TIERS.GUIDE;
  },

  /**
   * Check if a boolean feature is available at current tier
   */
  hasFeature(featureKey) {
    const limits = TIER_LIMITS[_currentTier] || TIER_LIMITS[TIERS.FREE];
    const value = limits[featureKey];
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value > 0;
    return false;
  },

  /**
   * Get numeric limit for current tier
   */
  getLimit(featureKey) {
    const limits = TIER_LIMITS[_currentTier] || TIER_LIMITS[TIERS.FREE];
    return limits[featureKey] ?? 0;
  },

  /**
   * Set tier (called after successful purchase or restore)
   */
  async setTier(tier, expiresAt = null) {
    _currentTier = tier;
    _expiresAt = expiresAt;
    await this._persist();
    this._notifyListeners();
  },

  /**
   * Subscribe to tier changes
   */
  addListener(callback) {
    _listeners.push(callback);
    return () => {
      _listeners = _listeners.filter(l => l !== callback);
    };
  },

  async _persist() {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ tier: _currentTier, expiresAt: _expiresAt }),
      );
    } catch (e) {
      console.warn('[Subscription] Failed to persist:', e);
    }
  },

  _notifyListeners() {
    _listeners.forEach(l => l(_currentTier));
  },
};

export default subscriptionService;
